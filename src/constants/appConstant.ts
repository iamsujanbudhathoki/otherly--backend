export default {
  APP_NAME: 'Stradmont Solutions',

  // Pagination
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 30,
};

export enum Environment {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
  TEST = 'TEST',
}

export enum MediaType {
  PRODUCT_IMAGE = 'PRODUCT_IMAGE',
  LETTER_COVER = 'LETTER_COVER',
}

export enum Role {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum TokenEnum {
  REFRESH_TOKEN = 'REFRESH_TOKEN',
  ACCESS_TOKEN = 'ACCESS_TOKEN',
}

export enum ContactTopic {
  PARTNERSHIP = 'Partnership',
  OUR_PRODUCTS = 'Our Products',
  INVESTMENT = 'Investment',
  OTHER = 'Other',
}

export enum ContactStatus {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ARCHIVED = 'ARCHIVED',
}

export enum LetterKind {
  LETTER = 'Letter',
  NOTE = 'Note',
  STUDY = 'Study',
}

export enum MailType {
  CONTACT_ADMIN_NOTIFICATION = 'CONTACT_ADMIN_NOTIFICATION',
  CONTACT_USER_ACKNOWLEDGEMENT = 'CONTACT_USER_ACKNOWLEDGEMENT',
}

export enum EmailDeliveryStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}
