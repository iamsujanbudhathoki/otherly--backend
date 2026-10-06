import { Role, SellerType, UserMode } from '../constants/appConstant';

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
  sellerType?: SellerType;
  businessName: string;
  panNumber?: string;
  documentMediaIds?: string[];
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
  activeMode: UserMode;
  hasSellerProfile: boolean;
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

export interface ToggleModeResponse {
  activeMode: UserMode;
  hasSellerProfile: boolean;
  isVendorVerified: boolean;
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
