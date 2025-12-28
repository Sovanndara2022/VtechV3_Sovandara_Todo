export type Todo = {
  id: string;
  todo: string;
  isCompleted: boolean;
  createdAt: string; // ISO timestamp
};

export type TodoMode = "dummy" | "live";

export type TodoCreateRequest = {
  id?: string;
  todo?: string;
  text?: string;
  isCompleted?: boolean;
  createdAt?: string;
};