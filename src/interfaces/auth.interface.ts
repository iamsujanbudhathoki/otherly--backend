import { Role } from '../constants/appConstant';

export interface CustomerProfileDto {
  id: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  preferences?: string;
  notes?: string;
}

export interface VendorProfileDto {
  id: string;
  businessName: string;
  businessRegistrationNumber?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  description?: string;
  isVerified: boolean;
  rating: number;
  totalReviews: number;
}

export interface UserProfileResponse {
  id: string;
  name?: string;
  email?: string;
  role: Role;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isVendorVerified: boolean;
  isActive: boolean;
  phoneNumber?: string;
  avatar?: string;
  businessName?: string;
  businessAddress?: string;
  customer?: CustomerProfileDto;
  vendor?: VendorProfileDto;
  createdAt: Date;
}

export interface AuthResponse {
  user: UserProfileResponse;
  accessToken: string;
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}
