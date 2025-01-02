"use client";
import dynamic from "next/dynamic";
import React, {useEffect} from "react";
import ChartOne from "../Charts/ChartOne";
import ChartTwo from "../Charts/ChartTwo";
import ChatCard from "../Chat/ChatCard";
import TableOne from "../Tables/TableOne";
import CardDataStats from "../CardDataStats";
import { useQuery } from "@tanstack/react-query";

const violationsService = {
  // Get today's violations stats
  async getData() {
    const response = await fetch('/dashboard');
    if (!response.ok) throw new Error('Failed to fetch today\'s stats');
    return response.json();
  },
}

const MapOne = dynamic(() => import("@/components/Maps/MapOne"), {
  ssr: false,
});

const ChartThree = dynamic(() => import("@/components/Charts/ChartThree"), {
  ssr: false,
});

const ECommerce: React.FC = () => {
  const { data: data, refetch } = useQuery({
    queryKey: ['violations', 'data'],
    queryFn: violationsService.getData,
    initialData: {
      totalIntrusionsToday: 0,
      peakHoursToday: 0,
      vulnerableZoneToday: 'N/A',
      totalIntrusionsMonthly: 0,
      peakHoursMonthly: 0,
      vulnerableZoneMonthly: 'N/A',
      last5Intrusion: null,
      isLoading: false
    }
  });
  console.log(data)
  console.log(data.isLoading)

  useEffect(() => {
    // Set up the interval to refetch data every 5 seconds
    const intervalId = setInterval(() => {
      refetch();
    }, 5000);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  if (!data.isLoading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
        {/* Or you can display a spinner */}
        {/* <Spinner /> */}
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex item-center justify-between">
        <div>
          <h2 className="mb-5 text-title-md2 font-bold text-black">
            Today's Violations
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        <CardDataStats title="Total Intrusions" total={data?.totalIntrusionsToday[0].TotalViolations.toString() || "0"}  rate="">
          {<svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24"
            height="24"
            viewBox="0 0 22 22" 
            fill="none" 
            stroke="blue" 
            stroke-width="1" 
            stroke-linecap="round" 
            stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
          }
        </CardDataStats>
        <CardDataStats title="Peak Hours" total={data?.peakHoursToday?.[0]?.hour != null 
              ? data.peakHoursToday[0].hour.toString() 
              : "NA"
            }  rate="">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 22 22" 
            fill="none" 
            stroke="blue" 
            stroke-width="1" 
            stroke-linecap="round" 
            stroke-linejoin="round">
              <path d="M5 22h14"/><path d="M5 2h14"/>
              <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>
              <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
          </svg>
        </CardDataStats>
        <CardDataStats title="Most Vulnerable Zone" 
          total={
            data?.vulnerableZoneToday?.[0]?.zone != null ?
            data.vulnerableZoneToday[0].zone.toString(): "NA"}  rate="" >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24"
          height="24"
          viewBox="0 0 24 22" 
          fill="none" 
          stroke="blue" 
          stroke-width="1" 
          stroke-linecap="round" 
          stroke-linejoin="round">
            <path d="m12 8 6-3-6-3v10"/>
            <path d="m8 11.99-5.5 3.14a1 1 0 0 0 0 1.74l8.5 4.86a2 2 0 0 0 2 0l8.5-4.86a1 1 0 0 0 0-1.74L16 12"/>
            <path d="m6.49 12.85 11.02 6.3"/>
            <path d="M17.51 12.85 6.5 19.15"/>
            </svg>
        </CardDataStats>
      </div>

      <div className="mb-5 flex item-center justify-between pt-6">
        <div>
          <h2 className="mb-5 text-title-md2 font-bold text-black">
            Monthly Violations
          </h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        <CardDataStats title="Total Intrusions" total={data?.totalIntrusionsMonthly[0].TotalViolations.toString() || "0"} rate="">
          {<svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24"
            height="24"
            viewBox="0 0 22 22" 
            fill="none" 
            stroke="blue" 
            stroke-width="1" 
            stroke-linecap="round" 
            stroke-linejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
              <path d="M12 9v4"/>
              <path d="M12 17h.01"/>
            </svg>
          }
        </CardDataStats>
        <CardDataStats title="Peak Hours" 
        total={data?.peakHoursMonthly?.[0]?.hour != null 
          ? data.peakHoursMonthly[0].hour.toString() 
          : "NA"
        } rate="">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 22 22" 
            fill="none" 
            stroke="blue" 
            stroke-width="1" 
            stroke-linecap="round" 
            stroke-linejoin="round">
              <path d="M5 22h14"/><path d="M5 2h14"/>
              <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/>
              <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>
          </svg>
        </CardDataStats>
        <CardDataStats title="Most Vulnerable Zone" 
        total={
          data?.vulnerableZoneMonthly?.[0]?.zone != null ?
          data.vulnerableZoneMonthly[0].zone.toString(): "NA"}
         rate="" >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24"
          height="24"
          viewBox="0 0 24 22" 
          fill="none" 
          stroke="blue" 
          stroke-width="1" 
          stroke-linecap="round" 
          stroke-linejoin="round">
            <path d="m12 8 6-3-6-3v10"/>
            <path d="m8 11.99-5.5 3.14a1 1 0 0 0 0 1.74l8.5 4.86a2 2 0 0 0 2 0l8.5-4.86a1 1 0 0 0 0-1.74L16 12"/>
            <path d="m6.49 12.85 11.02 6.3"/>
            <path d="M17.51 12.85 6.5 19.15"/>
            </svg>
        </CardDataStats>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-1 md:gap-6 xl:grid-cols-1 2xl:gap-7.5">
        <ChartOne data={data.chartData} />
        <div className="col-span-12 xl:col-span-8">
          <TableOne data={data.last5Intrusion}/>
        </div>
      </div>
    </>
  );
};

export default ECommerce;
