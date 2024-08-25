export interface NotificationPayload {
  notification: {
    title: string;
    body: string;
    image?: string;
  };
  data: {
    id: string;
    path?: string;
    live?: string;
    overlay?: string;
    popup?: string;
    sound?: string;
    flatId?: string;
  };
}
