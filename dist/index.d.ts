interface SyncToDbParams {
    prisma: any;
    modelName: string;
    idField: string;
    dataList: any[];
    deleteNotInclude: boolean;
}
export declare function syncToDb({ prisma, modelName, idField, dataList, deleteNotInclude, }: SyncToDbParams): Promise<{
    deleted: number;
    updated: number;
    created: number;
}>;
export {};
//# sourceMappingURL=index.d.ts.map