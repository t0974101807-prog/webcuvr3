import type { RecordItem } from "../../../domain/shared";

export type { RecordItem } from "../../../domain/shared";

export class SpecializedRecordsRepository {
  private records: RecordItem[] = [];
  private onUpdate: (recs: RecordItem[], changed?: RecordItem, deletedId?: string) => void;

  constructor(records: RecordItem[], onUpdate: (recs: RecordItem[], changed?: RecordItem, deletedId?: string) => void) {
    this.records = records;
    this.onUpdate = onUpdate;
  }

  updateState(records: RecordItem[]) {
    this.records = records;
  }

  getAll(): RecordItem[] {
    return this.records;
  }

  getByModule(practiceArea: string, category: string): RecordItem[] {
    return this.records.filter((r) => {
      if (r.practice_area) {
        return r.practice_area === practiceArea;
      }
      return r.category === category;
    });
  }

  create(record: RecordItem) {
    const updated = [record, ...this.records];
    this.records = updated;
    this.onUpdate(updated, record);
  }

  update(record: RecordItem) {
    const updated = this.records.map((r) => r.id === record.id ? record : r);
    this.records = updated;
    this.onUpdate(updated, record);
  }

  delete(id: string, fallbackRecord?: RecordItem | any) {
    const stringId = String(id);
    const target = this.records.find(
      (r) =>
        String(r.id) === stringId ||
        String(r.contractId) === stringId ||
        String((r as any).systemId) === stringId
    ) || fallbackRecord;
    const updated = this.records.filter(
      (r) =>
        String(r.id) !== stringId &&
        String(r.contractId) !== stringId &&
        String((r as any).systemId) !== stringId
    );
    this.records = updated;
    this.onUpdate(updated, target, id);
  }
}
