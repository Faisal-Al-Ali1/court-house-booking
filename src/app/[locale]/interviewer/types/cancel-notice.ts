export type CancelNotice = {
  kind: "notified" | "not-notified" | "gone";
  name: string;
  phone: string;
};
