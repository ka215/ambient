export interface CreateNoticeSupportOptions {
  getNoticeController(): {
    update(notification: NotificationPayload): void;
  } | null;
}

export interface NoticeSupport {
  updateNoticeController(notification: NotificationPayload): void;
}

export function createNoticeSupport(
  options: CreateNoticeSupportOptions
): NoticeSupport {
  return {
    updateNoticeController: (notification) => {
      options.getNoticeController()?.update(notification);
    },
  };
}
