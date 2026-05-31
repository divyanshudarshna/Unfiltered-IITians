import { ContactStatus, ContactUs, ConversationType } from "@prisma/client";

export type ConversationMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  cleanMessage: string;
  status: ContactStatus;
  conversationType: ConversationType;
  createdAt: string;
  updatedAt: string;
  isAdmin: boolean;
};

export type AdminConversation = {
  id: string;
  threadId: string | null;
  rootContactId: string;
  name: string;
  email: string;
  subject: string;
  status: ContactStatus;
  hasAdminReply: boolean;
  totalMessages: number;
  unreadUserCount: number;
  needsReply: boolean;
  lastMessageAt: string;
  createdAt: string;
  messages: ConversationMessage[];
};

export const getConversationKey = (contact: ContactUs) =>
  contact.threadId ? `thread:${contact.threadId}` : `single:${contact.id}`;

export const stripQuotedHistory = (message: string) =>
  message.split("\n\n-------")[0]?.trim() || "";

export function groupContactsIntoConversations(
  contacts: ContactUs[]
): AdminConversation[] {
  const groupMap = new Map<string, ContactUs[]>();

  const sortedByTime = [...contacts].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  );

  for (const contact of sortedByTime) {
    const key = getConversationKey(contact);
    const existing = groupMap.get(key);
    if (existing) {
      existing.push(contact);
    } else {
      groupMap.set(key, [contact]);
    }
  }

  const conversations: AdminConversation[] = [];

  for (const [key, messagesRaw] of groupMap.entries()) {
    const messagesSorted = [...messagesRaw].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    const rootMessage =
      messagesSorted.find((msg) => msg.conversationType === "NEW_INQUIRY") ||
      messagesSorted[0];
    const latestMessage = messagesSorted[messagesSorted.length - 1];

    const hasAdminReply = messagesSorted.some(
      (msg) => msg.conversationType === "ADMIN_REPLY"
    );

    const lastAdminMessage = [...messagesSorted]
      .reverse()
      .find((msg) => msg.conversationType === "ADMIN_REPLY");
    const lastAdminTime = lastAdminMessage?.createdAt.getTime() ?? 0;

    const unreadUserCount = messagesSorted.filter((msg) => {
      const isUserMessage =
        msg.conversationType === "NEW_INQUIRY" ||
        msg.conversationType === "USER_REPLY";
      return isUserMessage && msg.createdAt.getTime() > lastAdminTime;
    }).length;

    const isDeleted = latestMessage.status === "DELETED";
    const isResolved = latestMessage.status === "RESOLVED";
    const needsReply = !isDeleted && !isResolved && latestMessage.status === "PENDING";

    const status: ContactStatus =
      latestMessage.status === "DELETED"
        ? "DELETED"
        : needsReply
          ? "PENDING"
          : "RESOLVED";

    conversations.push({
      id: key,
      threadId: rootMessage.threadId,
      rootContactId: rootMessage.id,
      name: rootMessage.name,
      email: rootMessage.email,
      subject: rootMessage.subject,
      status,
      hasAdminReply,
      totalMessages: messagesSorted.length,
      unreadUserCount,
      needsReply,
      lastMessageAt: latestMessage.createdAt.toISOString(),
      createdAt: rootMessage.createdAt.toISOString(),
      messages: messagesSorted.map((msg) => ({
        id: msg.id,
        name: msg.name,
        email: msg.email,
        subject: msg.subject,
        message: msg.message,
        cleanMessage: stripQuotedHistory(msg.message),
        status: msg.status,
        conversationType: msg.conversationType,
        createdAt: msg.createdAt.toISOString(),
        updatedAt: msg.updatedAt.toISOString(),
        isAdmin: msg.conversationType === "ADMIN_REPLY",
      })),
    });
  }

  return conversations.sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}
