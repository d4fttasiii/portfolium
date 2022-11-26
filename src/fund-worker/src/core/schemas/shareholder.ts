import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShareholderDoc = Shareholder & Document;

@Schema({
  timestamps: {
    createdAt: true,
    updatedAt: true,
  },
})
export class Shareholder extends Document {
  @Prop({ type: String, length: 42, nullable: false, index: true })
  walletAddress: string;

  @Prop({ type: Number })
  shares: number;

  @Prop({ type: Boolean })
  isLocked: boolean;

  updatedAt: Date;
  createdAt: Date;
}

export const ShareholdertSchema = SchemaFactory.createForClass(Shareholder);
