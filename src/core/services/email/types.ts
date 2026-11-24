export type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export type OutgoingAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

export type OutgoingMail = {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
  text: string;
  attachments?: readonly OutgoingAttachment[];
};

export type MailTransport = (message: OutgoingMail) => Promise<void>;

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};
