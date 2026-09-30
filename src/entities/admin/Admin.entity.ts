import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import { Role } from '../../constants/appConstant';
import BcryptService from '../../utils/bcrypt.util';
import { CommonEntity } from '../common/common.entity';
import { Token } from '../token/Token.entity';

export enum AdminPermission {
  PRODUCT = 'PRODUCT',
  LETTERS = 'LETTERS',
  CONTACTS = 'CONTACTS',
  LOGS = 'LOGS',
}

@Entity({
  name: 'admin',
})
export class Admin extends CommonEntity {
  @Column({
    name: 'name',
  })
  name: string;

  @Column({
    name: 'email',
    unique: true,
  })
  email: string;

  @Column({
    name: 'password',
    select: false,
  })
  password: string;

  @Column({ type: 'simple-array', default: [] })
  permissions: AdminPermission[];

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({
    name: 'role',
    type: 'enum',
    enum: Role,
    default: Role.ADMIN,
  })
  role: Role;

  @OneToMany(() => Token, (token) => token.ownerId)
  token: Token;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) this.password = await BcryptService.hash(this.password);
  }
}
