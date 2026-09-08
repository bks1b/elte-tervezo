import { Ellipsis, Upload } from 'lucide-react';
import { read, utils } from 'xlsx';

import parseSheet from '../../../shared/parseSheet';
import { SearchResults, Subjects } from '../../../shared/types';
import { ModalType, useSetModal } from '../../contexts/modal';
import { upload } from '../../utils/browser';
import { useSetResults } from '../results';

const SHEET_NAME = 'Felvett kurzusok';

enum ImportColumn {
  ID = 0,
  NAME = 2,
  CODE = 3,
  TYPE = 4,
  SCHEDULE = 6,
  TEACHER = 7,
}

export default ({ handle }: { handle?: (x: Subjects) => Promise<SearchResults> }) => {
  const setResults = useSetResults();
  const setModal = useSetModal();
  return <button
    onClick={() =>
      setModal(
        ModalType.INFO,
        <p>
          A táblázatot Neptunban a <b>Menü &gt; Tárgyak &gt; Felvett kurzusok</b> oldalon, a{' '}
          <b>
            <Ellipsis/> &gt; Export
          </b>{' '}
          gombbal lehet letölteni.
        </p>,
        () =>
          upload('.xlsx').then(file => file.arrayBuffer()).then(read).then(async workbook => {
            if (workbook.SheetNames[0] !== SHEET_NAME) {
              throw setModal(
                ModalType.ERROR,
                <>
                  <p>
                    A táblázat munkalapjának elvárt neve: <b>{SHEET_NAME}</b>
                  </p>
                  <p>
                    A feltöltött munkalapok: <b>{workbook.SheetNames.join(', ')}</b>
                  </p>
                </>,
              );
            }
            const subjects: Subjects = {};
            for (
              const row of utils.sheet_to_json(workbook.Sheets[SHEET_NAME], {
                range: 1,
                header: 1,
                raw: true,
              }) as string[][]
            ) {
              parseSheet(
                subjects,
                [row[ImportColumn.CODE], row[ImportColumn.TYPE], row[ImportColumn.ID]],
                row[ImportColumn.NAME],
                row[ImportColumn.TEACHER].split(', '),
                row[ImportColumn.SCHEDULE],
                true,
              );
            }
            setResults(await handle?.(subjects) || { subjects });
          }),
      )}
  >
    <Upload/>
    {handle ? 'Felvett kurzusok betöltése' : 'Importálás Neptunból'}
  </button>;
};
