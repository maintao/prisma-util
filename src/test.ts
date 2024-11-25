import { syncToDb } from "./index";

async function test() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  let result;

  try {
    // 先清空表
    await prisma.example.deleteMany({});

    // 创建测试数据
    await prisma.example.create({
      data: {
        record_id: "id-1",
        name: "test-1",
      },
    });

    let testData = [
      { record_id: "id-1", name: "Test 1" },
      { record_id: "id-2", name: "Test 2" },
    ];

    result = await syncToDb({
      prisma,
      modelName: "example",
      idField: "record_id",
      dataList: testData,
      deleteNotInclude: false,
    });

    testData = [{ record_id: "id-3", name: "Test 3" }];

    result = await syncToDb({
      prisma,
      modelName: "example",
      idField: "record_id",
      dataList: testData,
      deleteNotInclude: true,
    });
  } finally {
    await prisma.$disconnect();
  }
}

test().catch(console.error);
