import mongoose, { ConnectOptions } from 'mongoose';
import { USER_ROLE, USER_STATUS } from '@/enum/user.enum';
import { hashData } from '@/server/helper/crypt';

interface MongooseCache {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    adminPromise: Promise<void> | null;
    adminEnsured: boolean;
}

const mongooseCache: MongooseCache = {
    conn: null,
    promise: null,
    adminPromise: null,
    adminEnsured: false,
};

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env'
    );
}

async function ensureAdminExists(connection: typeof mongoose): Promise<void> {
    if (mongooseCache.adminEnsured) return;

    if (mongooseCache.adminPromise) {
        await mongooseCache.adminPromise;
        return;
    }

    mongooseCache.adminPromise = (async () => {
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const adminPassword = process.env.ADMIN_PASSWORD?.trim();

        if (!adminEmail || !adminPassword) return;

        const usersCollection = connection.connection.db?.collection('users');
        if (!usersCollection) return;

        const existingAdmin = await usersCollection.findOne({
            $or: [{ role: USER_ROLE.ADMIN }, { email: adminEmail }],
        });

        if (existingAdmin) {
            const needsUpdate =
                existingAdmin.email !== adminEmail ||
                existingAdmin.password !== adminPassword ||
                existingAdmin.role !== USER_ROLE.ADMIN ||
                existingAdmin.status !== USER_STATUS.ACTIVE ||
                existingAdmin.isVerified !== true;

            if (needsUpdate) {
                await usersCollection.updateOne(
                    { _id: existingAdmin._id },
                    {
                        $set: {
                            email: adminEmail,
                            password: adminPassword,
                            role: USER_ROLE.ADMIN,
                            status: USER_STATUS.ACTIVE,
                            isVerified: true,
                            updatedAt: new Date(),
                        },
                    }
                );
            }

            mongooseCache.adminEnsured = true;
            return;
        }

        await usersCollection.insertOne({
            name: 'Admin',
            image: '',
            email: adminEmail,
            password: adminPassword,
            contact: '+880',
            status: USER_STATUS.ACTIVE,
            isVerified: true,
            role: USER_ROLE.ADMIN,
            otp: '',
            hashToken: await hashData(`${adminEmail}:${adminPassword}`),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        mongooseCache.adminEnsured = true;
    })();

    try {
        await mongooseCache.adminPromise;
    } finally {
        mongooseCache.adminPromise = null;
    }
}

export async function connectToDB(): Promise<typeof mongoose> {
    // If we have a cached connection, return it
    if (mongooseCache.conn) {
        await ensureAdminExists(mongooseCache.conn);
        return mongooseCache.conn;
    }

    // If we have a pending connection promise, wait for it
    if (mongooseCache.promise) {
        mongooseCache.conn = await mongooseCache.promise;
        return mongooseCache.conn;
    }

    // Create new connection promise
    const opts: ConnectOptions = {
        bufferCommands: false,
    };

    mongooseCache.promise = mongoose.connect(MONGODB_URI, opts);

    try {
        mongooseCache.conn = await mongooseCache.promise;
        await ensureAdminExists(mongooseCache.conn);
    } catch (e) {
        // Reset promise on error to allow retries
        mongooseCache.promise = null;
        throw e;
    }

    return mongooseCache.conn;
}

export default connectToDB;
