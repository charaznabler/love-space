export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: 'happy' | 'sad' | 'neutral' | 'loving' | 'angry';
}

export interface RewardState {
  flowerCount: number;
  wishesRedeemed: number;
  history: {
    id: string;
    type: 'add' | 'redeem';
    date: string;
    note?: string;
  }[];
}

export interface GiftItem {
  id: string;
  name: string;
  link?: string;
  image?: string;
  status: 'wanted' | 'purchased';
  category?: 'clothes' | 'bags' | 'cosmetics' | 'electronics' | 'shoes' | 'others';
  note?: string;
}

export type GiftCategory = NonNullable<GiftItem['category']>;
