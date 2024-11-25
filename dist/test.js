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
const index_1 = require("./index");
function test() {
    return __awaiter(this, void 0, void 0, function* () {
        const { PrismaClient } = require("@prisma/client");
        const prisma = new PrismaClient();
        let result;
        try {
            // 先清空表
            yield prisma.example.deleteMany({});
            // 创建测试数据
            yield prisma.example.create({
                data: {
                    record_id: "id-1",
                    name: "test-1",
                },
            });
            let testData = [
                { record_id: "id-1", name: "Test 1" },
                { record_id: "id-2", name: "Test 2" },
            ];
            result = yield (0, index_1.syncToDb)({
                prisma,
                modelName: "example",
                idField: "record_id",
                dataList: testData,
                deleteNotInclude: false,
            });
            testData = [{ record_id: "id-3", name: "Test 3" }];
            result = yield (0, index_1.syncToDb)({
                prisma,
                modelName: "example",
                idField: "record_id",
                dataList: testData,
                deleteNotInclude: true,
            });
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
test().catch(console.error);
//# sourceMappingURL=test.js.map