interface SyncToDbParams {
  prisma: any;
  modelName: string;
  idField: string;
  dataList: any[];
  deleteNotInclude: boolean;
}

function areEqual(a: any, b: any) {
  if (a == null && b == null) {
    // null 和 undefined 视为相等
    return true;
  } else if (typeof a === "object" && a !== null) {
    // json 对象
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      return true;
    }
  } else {
    // 其他使用严格比较
    return a === b;
  }
}

export async function syncToDb({
  prisma,
  modelName,
  idField,
  dataList,
  deleteNotInclude,
}: SyncToDbParams) {
  console.log("Syncing data to DB...");
  console.log(`Using ID field: ${idField}`);
  console.log(`Total records: ${dataList.length}`);

  let fields = Object.keys(dataList[0]);
  if (!fields.includes(idField)) {
    throw new Error(`ID field ${idField} not found in dataList`);
  }
  fields = fields.filter((field) => field !== idField); // filter out idField

  console.log(fields);

  const dbRecords = await prisma[modelName].findMany({
    where: {
      [idField]: {
        in: dataList.map((record: any) => record[idField]),
      },
    },
  });
  // 为了快速查找
  const dbMap = new Map(dbRecords.map((item: any) => [item[idField], item]));

  // 需要新增的数据
  const needCreateList = dataList.filter((sourceRecord: any) => {
    if (!dbMap.has(sourceRecord[idField])) {
      // DB 中不存在，则需要新增
      return true;
    }
    return false;
  });

  // 需要更新的数据
  const needUpdateList = dataList.filter((sourceRecord: any) => {
    const existedRecord: any = dbMap.get(sourceRecord[idField]);
    if (existedRecord) {
      // 存在，则需要比较值是否相等，不全相等的则需要更新
      for (const field of fields) {
        if (!areEqual(existedRecord[field], sourceRecord[field])) {
          return true; // 任何一个字段不等，则需要更新
        }
      }
    }
    return false; // 没有ID重合记录或全相等，则不需要更新
  });

  const result = {
    deleted: 0,
    updated: 0,
    created: 0,
  };

  // Bulk upsert records using transaction
  await prisma.$transaction(async (tx: any) => {
    // 先删除
    if (deleteNotInclude) {
      const { count } = await tx[modelName].deleteMany({
        // 删除不在飞书表格中的数据
        where: { [idField]: { notIn: dataList.map((record: any) => record[idField]) } },
      });
      result.deleted = count;
    }

    // 再更新
    for (const record of needUpdateList) {
      await tx[modelName].update({
        select: {
          [idField]: true, // 只需要返回ID
        },
        where: {
          [idField]: record[idField],
        },
        data: record,
      });
      result.updated += 1;
    }

    // 最后新增
    const { count } = await tx[modelName].createMany({
      data: needCreateList,
    });
    result.created = count;
  });

  console.log("SyncToDb result:", result);
  return result;
}
