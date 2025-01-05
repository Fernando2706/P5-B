import { Collection,Db, MongoClient, ObjectId, WithId } from "mongodb"

export default class MongoService {
    private client: MongoClient;
    private db: Db;

    constructor() {
        // Lee variables de entorno
        const uri = Deno.env.get("MONGO_URI") || "mongodb://localhost:27017";
        const dbName = Deno.env.get("MONGO_DB_NAME") || "mi_base_de_datos";

        this.client = new MongoClient(uri);
        this.db = this.client.db(dbName);
    }

    destroy() {
        this.client.close();
    }

    private getCollection<T>(name: string): Collection<T> {
        return this.db.collection<T>(name);   
    }

    public async create<T>(collectionName: string, doc: T): Promise<WithId<T>> {
        const collection = this.getCollection<T>(collectionName);
        const {insertedId} = await collection.insertOne(doc as any);
        return {_id: insertedId.toString(), ...doc};
    }

    public async findAll<T>(collectionName: string): Promise<WithId<T>[]> {
        const collection = this.getCollection<T>(collectionName);
        return await collection.find().toArray();
    }

    public async findById<T>(collectionName: string, id: string): Promise<WithId<T> | null> {
        const collection = this.getCollection<T>(collectionName);
        return await collection.findOne({ _id: new ObjectId(id) });
    }

    public async findByFilter<T>(collectionName: string, filter: object): Promise<WithId<T>[]> {
        const collection = this.getCollection<T>(collectionName);
        return await collection.find(filter).toArray();
    }

    public async updateById<T>(collectionName: string, id: string, operation: object): Promise<boolean> {
        const collection = this.getCollection<T>(collectionName);
        const { modifiedCount } = await collection.updateOne({ _id: new ObjectId(id) }, operation);
        return modifiedCount === 1;
    }

    public async deleteById<T>(collectionName: string, id: string): Promise<boolean> {
        const collection = this.getCollection<T>(collectionName);
        const { deletedCount } = await collection.deleteOne({ _id: new ObjectId(id) });
        return deletedCount === 1;
    }
}