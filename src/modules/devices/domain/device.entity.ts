import { User } from '@modules/users/domain/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ip: string;

  @Column()
  title: string;

  @Column({ name: 'deviceName' })
  deviceName: string;

  @Column()
  iat: number;

  @Column()
  exp: number;

  @Column({ name: 'lastActiveDate', type: 'timestamp with time zone' })
  lastActiveDate: Date;

  @Column({ name: 'createdAt' })
  createdAt: string;

  @Column({ name: 'deviceId' })
  deviceId: string;

  @ManyToOne(() => User, (user) => user, { onDelete: 'CASCADE' })
  user: User;

  @Column({ name: 'userId' })
  userId: string;
}
