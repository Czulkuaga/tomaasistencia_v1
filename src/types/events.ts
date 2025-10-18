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
  total_scoring_stands?: string,
  total_scoring_activities?: string,
  is_active: boolean;
  is_public_event: boolean;
  event_image?:EventImage
}

export interface EventResponse {
  events: Event[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export type EventImage = string | File | Blob;