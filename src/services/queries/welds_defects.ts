import WeldDefect from '../../interfaces/WeldsDefect.js';
import sql from '../db_connect.js';

export async function getWeldsDefects(): Promise<WeldDefect[] | null> {
  try {
    const weldsDefects = await sql`
    select
      name
    from welds_defects
  `;

    return weldsDefects as unknown as WeldDefect[];
  } catch (error: any) {
    console.log(`error in getWeldsDefects: ${error}`);
    return null;
  }
}
