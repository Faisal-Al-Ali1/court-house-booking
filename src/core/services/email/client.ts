import { Resend } from "resend";
import { routing, type Locale } from "../../i18n/routing.ts";
import type { MailTransport, OutgoingMail } from "./types.ts";

export const DISPLAY_NAME = "Court House+";

const ADDRESS_PATTERN = /^[^\s<>"',;()[\]\\]+@[^\s<>"',;()[\]\\]+$/;
const ANGLE_ADDRESS_PATTERN = /<([^<>]+)>\s*$/;

type Env = Readonly<Record<string, string | undefined>>;

export type MailConfig = {
  apiKey: string;
  from: string;
  replyTo: string;
};

export class MailConfigError extends Error {
  readonly variables: readonly string[];

  constructor(variables: readonly string[]) {
    super("mail configuration is incomplete");
    this.name = "MailConfigError";
    this.variables = variables;
  }
}

export class MailSendError extends Error {
  readonly code: string;

  constructor(code: string) {
    super("mail send rejected");
    this.name = "MailSendError";
    this.code = code;
  }
}

function readAddress(env: Env, name: string): string | null {
  const raw = env[name]?.trim();
  if (!raw) {
    return null;
  }
  const bare = ANGLE_ADDRESS_PATTERN.exec(raw)?.[1].trim() ?? raw;
  return ADDRESS_PATTERN.test(bare) ? bare : null;
}

export function readMailConfig(env: Env = process.env): MailConfig {
  const apiKey = env.RESEND_API_KEY?.trim() ?? "";
  const from = readAddress(env, "MAIL_FROM");
  const replyTo = readAddress(env, "MAIL_REPLY_TO");
  const problems: string[] = [];
  if (!apiKey) problems.push("RESEND_API_KEY");
  if (!from) problems.push("MAIL_FROM");
  if (!replyTo) problems.push("MAIL_REPLY_TO");
  if (problems.length > 0 || !from || !replyTo) {
    throw new MailConfigError(problems);
  }
  return { apiKey, from, replyTo };
}

export function readInterviewerEmail(env: Env = process.env): string {
  const address = readAddress(env, "INTERVIEWER_EMAIL");
  if (!address) {
    throw new MailConfigError(["INTERVIEWER_EMAIL"]);
  }
  return address;
}

export function readInterviewerLocale(env: Env = process.env): Locale {
  const raw = env.INTERVIEWER_LOCALE?.trim().toLowerCase();
  return routing.locales.find((locale) => locale === raw) ?? routing.defaultLocale;
}

export function formatFrom(address: string): string {
  return `"${DISPLAY_NAME}" <${address}>`;
}

export type ResendLike = {
  emails: {
    send: (payload: {
      from: string;
      to: string;
      replyTo: string;
      subject: string;
      html: string;
      text: string;
      attachments?: {
        filename: string;
        content: Buffer;
        contentType: string;
      }[];
    }) => Promise<{ error: { name: string } | null }>;
  };
};

export function createResendTransport(
  readApiKey: () => string = () => readMailConfig().apiKey,
  createClient: (apiKey: string) => ResendLike = (apiKey) => new Resend(apiKey),
): MailTransport {
  return async (message: OutgoingMail) => {
    const client = createClient(readApiKey());
    const { error } = await client.emails.send({
      from: message.from,
      to: message.to,
      replyTo: message.replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
      attachments: message.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        contentType: attachment.contentType,
      })),
    });
    if (error) {
      throw new MailSendError(error.name);
    }
  };
}
