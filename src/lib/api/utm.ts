import { apiClient } from "@/lib/api/client";

export interface UtmTagsAtivas {
  source: string[];
  medium: string[];
  campaign: string[];
}

/** Tags de UTM ativas, cadastradas na seção "UTM" do painel administrativo. */
export async function fetchUtmTags(): Promise<UtmTagsAtivas> {
  const response = await apiClient.get<{ message: string; data: UtmTagsAtivas }>("/utm/tags");
  return response.data;
}
