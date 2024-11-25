"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncToDb = syncToDb;
function areEqual(a, b) {
    if (a == null && b == null) {
        // null 和 undefined 视为相等
        return true;
    }
    else if (typeof a === "object" && a !== null) {
        // json 对象
        if (JSON.stringify(a) !== JSON.stringify(b)) {
            return true;
        }
    }
    else {
        // 其他使用严格比较
        return a === b;
    }
}
function syncToDb(_a) {
    return __awaiter(this, arguments, void 0, function* ({ prisma, modelName, idField, dataList, deleteNotInclude, }) {
        console.log("Syncing data to DB...");
        console.log(`Using ID field: ${idField}`);
        console.log(`Total records: ${dataList.length}`);
        let fields = Object.keys(dataList[0]);
        if (!fields.includes(idField)) {
            throw new Error(`ID field ${idField} not found in dataList`);
        }
        fields = fields.filter((field) => field !== idField); // filter out idField
        console.log(fields);
        const dbRecords = yield prisma[modelName].findMany({
            where: {
                [idField]: {
                    in: dataList.map((record) => record[idField]),
                },
            },
        });
        // 为了快速查找
        const dbMap = new Map(dbRecords.map((item) => [item[idField], item]));
        // 需要新增的数据
        const needCreateList = dataList.filter((sourceRecord) => {
            if (!dbMap.has(sourceRecord[idField])) {
                // DB 中不存在，则需要新增
                return true;
            }
            return false;
        });
        // 需要更新的数据
        const needUpdateList = dataList.filter((sourceRecord) => {
            const existedRecord = dbMap.get(sourceRecord[idField]);
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
        yield prisma.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
            // 先删除
            if (deleteNotInclude) {
                const { count } = yield tx[modelName].deleteMany({
                    // 删除不在飞书表格中的数据
                    where: { [idField]: { notIn: dataList.map((record) => record[idField]) } },
                });
                result.deleted = count;
            }
            // 再更新
            for (const record of needUpdateList) {
                yield tx[modelName].update({
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
            const { count } = yield tx[modelName].createMany({
                data: needCreateList,
            });
            result.created = count;
        }));
        console.log("SyncToDb result:", result);
        return result;
    });
}
//# sourceMappingURL=index.js.map