export type Bindings = {
  DATABASE_URL: string;
};
export type Variables = {
  userId: string;
  role: string;
};


export type Role = "admin" | "member";

export const roleRank: Record<Role, number> = {
  admin: 2,
  member: 1,
};
