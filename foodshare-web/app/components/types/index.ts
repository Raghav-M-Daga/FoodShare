export interface Issue {
  id: string;
  title: string;
  location: {
    lng: number;
    lat: number;
  };
  description: string;
  date: string;
  host: string;
  startTime: string;
  endTime: string;
  cost: string;
  userId: string;
  createdAt: string;
  category?: string;
}
