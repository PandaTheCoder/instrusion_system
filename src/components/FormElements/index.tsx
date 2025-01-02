"use client";
import React, { useState , useRef } from "react";
import flatpickr from "flatpickr";
import { useEffect } from "react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

interface ReportData {
  id: number;
  image: string;
  date: string;
  time: string;
  camera: string;
  zone: string;
  created_at: string;
}

const FormElements = () => {
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reportData, setReportData] = useState<ReportData[]>([]);
  
  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startDateRef.current && endDateRef.current) {
      const startPicker = flatpickr(startDateRef.current, {
        mode: "single",
        dateFormat: "d/m/Y",
        onChange: (selectedDates, dateStr) => setStartDate(dateStr),
      });

      const endPicker = flatpickr(endDateRef.current, {
        mode: "single",
        dateFormat: "d/m/Y", 
        onChange: (selectedDates, dateStr) => setEndDate(dateStr),
      });

      return () => {
        startPicker.destroy();
        endPicker.destroy();
      };
    }
  }, []);

  const fetchReportData = async () => {
    try {
      // Replace with your actual API endpoint
      console.log({ startDate, endDate })
      
      const response = await fetch('/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startDate, endDate })
      });
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data: ReportData[] = await response.json();
      console.log(data)

      if (!data.length){
        alert("Data not available for selected dates")
        return
      }

      return data
    } catch (error) {
      console.error('Error fetching report:', error);
    }
  };

const generatePDF = async () => {
  //  let response = await fetchReportData()
  // console.log(data)
  // if (!data || !data.length){
  //   return
  // }
  // setReportData(data)

  // const doc = new jsPDF();
  
  // doc.setFontSize(18);
  // doc.text('Violation Report', 14, 22);

  // const tableColumn: string[] = ["Date", "Time", "Camera", "Zone", "Image"];
  // const tableRows: any[] = data.map((item) => [
  //     item.date,
  //     item.time,
  //     item.camera,
  //     item.zone,
  //     item.image
  // ]);

  // autoTable(doc, {
  //     startY: 30,
  //     head: [tableColumn],
  //     body: tableRows,
  //     columnStyles: { 
  //       0: { cellWidth: 30 }, // First column width
  //       1: { cellWidth: 30 }, // Second column width
  //       2: { cellWidth: 30 },
  //       3: {cellWidth: 20},
  //       4: { 
  //           cellWidth: 40,
  //           halign: 'center',
            
  //       } 
  //     },
  //     bodyStyles: {
  //         minCellHeight: 60 // Fixed minimum cell height
  //     },
  //     didDrawCell: function (data: any) {
  //         // Check if we're in the body section and the last column (image)
  //         if (data.section === 'body' && data.column.index === tableColumn.length - 1) {
  //             const imageUrl = data.cell.raw;
  //             if (imageUrl) {
  //                 try {
  //                     // Add image to the cell
                      
  //                     doc.addImage(
  //                         imageUrl, 
  //                         'PNG', 
  //                         data.cell.x + 3, 
  //                         data.cell.y + 2, 
  //                         40, 
  //                         30
  //                     );
  //                     // Clear the cell text to prevent overlapping
  //                     data.cell.text = '';
  //                 } catch (error) {
  //                     console.error('Image add error:', error);
  //                 }
  //             }
  //             data.cell.raw = ''
  //         }
  //     }
  // });

  // doc.save('report.pdf');
    const response = await fetch('/forms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ startDate, endDate })
    });
    const blob = await response.blob();
    console.log(blob)
      // Create a download link
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'document.pdf';
    
    // Append to body, trigger click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

}

// const generatePDFNew = async () => {
//   try {
//     const response = await fetch('/generate-report-pdf', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ startDate, endDate })
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       alert(errorData.message || 'Failed to generate PDF');
//       return;
//     }

//     // Create a blob from the response
//     const blob = await response.blob();
    
//     // Create a link and trigger download
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'report.pdf';
//     document.body.appendChild(a);
//     a.click();
//     a.remove();
//   } catch (error) {
//     console.error('PDF download error:', error);
//     alert('Failed to download PDF');
//   }
// };
  return (
    <>
      
      <div className="flex justify-center items-center w-full">
        <div className="w-full max-w-xl">
          <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
            <div className="border-b border-stroke px-6.5 py-4 dark:border-strokedark">
              <h3 className="font-medium text-black dark:text-white">
                Generate Report (Select Date Range)
              </h3>
            </div>
            
              <div className="p-6.5">
                <div className="flex flex-col gap-5.5 p-6.5">
                    <div>
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        Start Date
                      </label>
                      <div className="relative">
                        <input
                          ref={startDateRef}
                          
                          className="start-datepicker w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-normal outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                          placeholder="--select start date --"
                          data-class="flatpickr-right"
                        />

                          <div className="pointer-events-none absolute inset-0 left-auto right-5 flex items-center">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 18 18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M15.7504 2.9812H14.2879V2.36245C14.2879 2.02495 14.0066 1.71558 13.641 1.71558C13.2754 1.71558 12.9941 1.99683 12.9941 2.36245V2.9812H4.97852V2.36245C4.97852 2.02495 4.69727 1.71558 4.33164 1.71558C3.96602 1.71558 3.68477 1.99683 3.68477 2.36245V2.9812H2.25039C1.29414 2.9812 0.478516 3.7687 0.478516 4.75308V14.5406C0.478516 15.4968 1.26602 16.3125 2.25039 16.3125H15.7504C16.7066 16.3125 17.5223 15.525 17.5223 14.5406V4.72495C17.5223 3.7687 16.7066 2.9812 15.7504 2.9812ZM1.77227 8.21245H4.16289V10.9968H1.77227V8.21245ZM5.42852 8.21245H8.38164V10.9968H5.42852V8.21245ZM8.38164 12.2625V15.0187H5.42852V12.2625H8.38164V12.2625ZM9.64727 12.2625H12.6004V15.0187H9.64727V12.2625ZM9.64727 10.9968V8.21245H12.6004V10.9968H9.64727ZM13.8379 8.21245H16.2285V10.9968H13.8379V8.21245ZM2.25039 4.24683H3.71289V4.83745C3.71289 5.17495 3.99414 5.48433 4.35977 5.48433C4.72539 5.48433 5.00664 5.20308 5.00664 4.83745V4.24683H13.0504V4.83745C13.0504 5.17495 13.3316 5.48433 13.6973 5.48433C14.0629 5.48433 14.3441 5.20308 14.3441 4.83745V4.24683H15.7504C16.0316 4.24683 16.2566 4.47183 16.2566 4.75308V6.94683H1.77227V4.75308C1.77227 4.47183 1.96914 4.24683 2.25039 4.24683ZM1.77227 14.5125V12.2343H4.16289V14.9906H2.25039C1.96914 15.0187 1.77227 14.7937 1.77227 14.5125ZM15.7504 15.0187H13.8379V12.2625H16.2285V14.5406C16.2566 14.7937 16.0316 15.0187 15.7504 15.0187Z"
                                fill="#64748B"
                              />
                            </svg>
                          </div>
                      </div>
                    </div>
                    <div>
                      <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                        End Date
                      </label>
                      <div className="relative">
                        <input ref={endDateRef}
                          className="end-datepicker w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 font-normal outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                          placeholder="--select end date --"
                          data-class="flatpickr-right"
                        />

                          <div className="pointer-events-none absolute inset-0 left-auto right-5 flex items-center">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 18 18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M15.7504 2.9812H14.2879V2.36245C14.2879 2.02495 14.0066 1.71558 13.641 1.71558C13.2754 1.71558 12.9941 1.99683 12.9941 2.36245V2.9812H4.97852V2.36245C4.97852 2.02495 4.69727 1.71558 4.33164 1.71558C3.96602 1.71558 3.68477 1.99683 3.68477 2.36245V2.9812H2.25039C1.29414 2.9812 0.478516 3.7687 0.478516 4.75308V14.5406C0.478516 15.4968 1.26602 16.3125 2.25039 16.3125H15.7504C16.7066 16.3125 17.5223 15.525 17.5223 14.5406V4.72495C17.5223 3.7687 16.7066 2.9812 15.7504 2.9812ZM1.77227 8.21245H4.16289V10.9968H1.77227V8.21245ZM5.42852 8.21245H8.38164V10.9968H5.42852V8.21245ZM8.38164 12.2625V15.0187H5.42852V12.2625H8.38164V12.2625ZM9.64727 12.2625H12.6004V15.0187H9.64727V12.2625ZM9.64727 10.9968V8.21245H12.6004V10.9968H9.64727ZM13.8379 8.21245H16.2285V10.9968H13.8379V8.21245ZM2.25039 4.24683H3.71289V4.83745C3.71289 5.17495 3.99414 5.48433 4.35977 5.48433C4.72539 5.48433 5.00664 5.20308 5.00664 4.83745V4.24683H13.0504V4.83745C13.0504 5.17495 13.3316 5.48433 13.6973 5.48433C14.0629 5.48433 14.3441 5.20308 14.3441 4.83745V4.24683H15.7504C16.0316 4.24683 16.2566 4.47183 16.2566 4.75308V6.94683H1.77227V4.75308C1.77227 4.47183 1.96914 4.24683 2.25039 4.24683ZM1.77227 14.5125V12.2343H4.16289V14.9906H2.25039C1.96914 15.0187 1.77227 14.7937 1.77227 14.5125ZM15.7504 15.0187H13.8379V12.2625H16.2285V14.5406C16.2566 14.7937 16.0316 15.0187 15.7504 15.0187Z"
                                fill="#64748B"
                              />
                            </svg>
                          </div>
                      </div>
                    </div>
                </div>
                <button onClick={generatePDF} className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray hover:bg-opacity-90">
                  Generate
                </button>
              </div>
            
          </div>
        </div>
      </div>
    </>
  );
};

export default FormElements;