import { AuthChecker } from 'type-graphql';
import { Role } from '../../constants/appConstant';
import { AdminPermission } from '../../entities/admin/Admin.entity';
import { GraphQLContext } from '../context';

export const customAuthChecker: AuthChecker<GraphQLContext> = (
  { context },
  roles,
) => {
  const { user } = context;
  if (!user) {
    return false;
  }

  // If @Authorized() is used without arguments, any authenticated user is allowed
  if (!roles || roles.length === 0) {
    return true;
  }

  // Super admins have access to all routes/mutations
  if (user.role === Role.SUPER_ADMIN) {
    return true;
  }

  // Check if user has the specified role or required permissions
  return roles.some((roleOrPermission) => {
    if (user.role === roleOrPermission) {
      return true;
    }
    if (user.permissions?.includes(roleOrPermission as AdminPermission)) {
      return true;
    }
    return false;
  });
};
