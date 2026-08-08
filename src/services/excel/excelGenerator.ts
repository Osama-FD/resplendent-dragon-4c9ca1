import { sanitizeSheetName } from "./helpers";
import { WorksheetBuilder } from "./worksheetBuilder";

export interface CreateWorksheetOptions {
  /** If a worksheet with this name already exists, delete it and create a fresh one. Defaults to true. */
  replaceExisting?: boolean;
}

/**
 * Creates a worksheet by name inside the given request context, optionally
 * replacing an existing one with the same name. Generic - has no idea what
 * ends up written to the sheet.
 */
export async function createWorksheet(
  context: Excel.RequestContext,
  name: string,
  options: CreateWorksheetOptions = {}
): Promise<Excel.Worksheet> {
  const sheetName = sanitizeSheetName(name);
  const { replaceExisting = true } = options;

  if (replaceExisting) {
    const existing = context.workbook.worksheets.getItemOrNullObject(sheetName);
    existing.load("isNullObject");
    await context.sync();
    if (!existing.isNullObject) {
      existing.delete();
    }
  }

  return context.workbook.worksheets.add(sheetName);
}

/**
 * Top-level entry point for generating any worksheet: opens an Excel.run
 * batch, creates (or replaces) the named sheet, hands the caller a
 * WorksheetBuilder to fill it in with, then activates the sheet and syncs
 * once. The `build` callback is the only place that knows what should
 * actually be written - this function has no business logic of its own,
 * so it's reusable for any worksheet the app generates later.
 */
export async function generateWorksheet(
  sheetName: string,
  build: (builder: WorksheetBuilder, sheet: Excel.Worksheet) => void | Promise<void>,
  options: CreateWorksheetOptions = {}
): Promise<void> {
  await Excel.run(async (context) => {
    const sheet = await createWorksheet(context, sheetName, options);
    const builder = new WorksheetBuilder(sheet);

    await build(builder, sheet);

    sheet.activate();
    await context.sync();
  });
}
