import { Role } from '../constants/appConstant';
import { AdminPermission } from '../entities/admin/Admin.entity';

export interface AdminLoginResponse {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: AdminPermission[];
  isActive: boolean;
  accessToken: string;
  refreshToken: string;
}
