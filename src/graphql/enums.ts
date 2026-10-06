import { registerEnumType } from 'type-graphql';
import {
  ContactStatus,
  ContactTopic,
  LetterKind,
  MediaType,
  OfferFulfillType,
  OfferStatus,
  OrderSourceType,
  OrderStatus,
  RequestStatus,
  Role,
} from '../constants/appConstant';
import { AdminPermission } from '../entities/admin/Admin.entity';

export function registerEnums(): void {
  registerEnumType(Role, {
    name: 'Role',
    description: 'User role levels',
  });

  registerEnumType(AdminPermission, {
    name: 'AdminPermission',
    description: 'Administrative granular permissions',
  });

  registerEnumType(ContactTopic, {
    name: 'ContactTopic',
    description: 'Contact form topic options',
  });

  registerEnumType(ContactStatus, {
    name: 'ContactStatus',
    description: 'Status of incoming contact requests',
  });

  registerEnumType(LetterKind, {
    name: 'LetterKind',
    description: 'Newsletter/letter kinds',
  });

  registerEnumType(MediaType, {
    name: 'MediaType',
    description: 'Types of uploaded media',
  });

  registerEnumType(RequestStatus, {
    name: 'RequestStatus',
    description: 'Status of buyer product/project requests',
  });

  registerEnumType(OfferStatus, {
    name: 'OfferStatus',
    description: 'Status of vendor offers',
  });

  registerEnumType(OfferFulfillType, {
    name: 'OfferFulfillType',
    description: 'Inventory or fulfillment type for vendor offers',
  });

  registerEnumType(OrderStatus, {
    name: 'OrderStatus',
    description: 'Marketplace order status',
  });

  registerEnumType(OrderSourceType, {
    name: 'OrderSourceType',
    description: 'Source origin of the order (Direct product or reverse offer)',
  });
}
