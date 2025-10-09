export interface Event {
  id_event?: number;
  name?: string;
  description?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_public_event: boolean;
}

export interface EventResponse {
  events: Event[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}
