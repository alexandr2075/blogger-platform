import { Injectable } from "@nestjs/common";
import { PostgresService } from "../../../core/database/postgres.config";
import { Device } from "../domain/device.entity";

@Injectable()
export class DevicesRepositoryPostgres {
    constructor(
        private readonly postgresService: PostgresService,
    ) {}

    async create(device: Device): Promise<Device> {
        const query = `
            INSERT INTO devices (
                user_id, device_id, iat, device_name, ip, exp
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [
            device.userId,
            device.deviceId,
            device.iat,
            device.deviceName,
            device.ip,
            device.exp,
        ];

        const result = await this.postgresService.query(query, values);
        return this.mapRowToDevice(result[0]);
    }

    async findByDeviceId(deviceId: string): Promise<Device | null> {
        const query = `SELECT * FROM devices WHERE device_id = $1`;
        const result = await this.postgresService.query(query, [deviceId]);
        return result.length > 0 ? this.mapRowToDevice(result[0]) : null;
    }

    async findByUserIdAndDeviceId(userId: string, deviceId: string): Promise<Device | null> {
        const query = `SELECT * FROM devices WHERE user_id = $1 AND device_id = $2`;
        const result = await this.postgresService.query(query, [userId, deviceId]);
        return result.length > 0 ? this.mapRowToDevice(result[0]) : null;
    }

    async findAllByUserId(userId: string): Promise<Device[]> {
        const query = `SELECT * FROM devices WHERE user_id = $1 ORDER BY created_at DESC`;
        const result = await this.postgresService.query(query, [userId]);
        return result.map(row => this.mapRowToDevice(row));
    }

    async deleteByDeviceId(deviceId: string): Promise<void> {
        const query = `DELETE FROM devices WHERE device_id = $1`;
        await this.postgresService.query(query, [deviceId]);
    }

    async deleteAllByUserId(userId: string): Promise<void> {
        const query = `DELETE FROM devices WHERE user_id = $1`;
        await this.postgresService.query(query, [userId]);
    }

    async deleteAllExceptCurrent(userId: string, currentDeviceId: string): Promise<void> {
        const query = `DELETE FROM devices WHERE user_id = $1 AND device_id != $2`;
        await this.postgresService.query(query, [userId, currentDeviceId]);
    }

    async updateIat(userId: string, deviceId: string, newIat: number): Promise<void> {
        const query = `UPDATE devices SET iat = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND device_id = $3`;
        await this.postgresService.query(query, [newIat, userId, deviceId]);
    }

    async deleteByUserIdAndDeviceId(userId: string, deviceId: string): Promise<void> {
        const query = `DELETE FROM devices WHERE user_id = $1 AND device_id = $2`;
        await this.postgresService.query(query, [userId, deviceId]);
    }

    async deleteAll(): Promise<void> {
        const query = `DELETE FROM devices`;
        await this.postgresService.query(query, []);
    }

    private mapRowToDevice(row: any): Device {
        const device = new Device();
        device.id = row.id;
        device.userId = row.user_id;
        device.deviceId = row.device_id;
        device.iat = row.iat;
        device.deviceName = row.device_name;
        device.ip = row.ip;
        device.exp = row.exp;
        device.createdAt = row.created_at;
        device.updatedAt = row.updated_at;
        return device;
    }
}
