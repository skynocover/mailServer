import xlsx from 'xlsx';

// 指定标题单元格样式：加粗居中
let headerStyle = {
  font: {
    bold: true,
  },
  alignment: {
    horizontal: 'center',
  },
};

export async function messageXlsx(dataArray: any[]) {
  dataArray.unshift([
    { v: 'id', s: headerStyle },
    { v: '電話', s: headerStyle },
    { v: '訊息', s: headerStyle },
    { v: '錯誤原因', s: headerStyle },
    { v: '發送時間', s: headerStyle },
  ]);

  const a: xlsx.ColInfo[] = [{ wch: 24 }, { wch: 11 }, { wch: 20 }, { wch: 20 }, { wch: 18 }];
  const sheet = xlsx.utils.aoa_to_sheet(dataArray);
  sheet['!cols'] = a;
  const book = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(book, sheet, '簡訊發送列表');
  return book;
}
