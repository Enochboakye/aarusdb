import Chart1 from '@/components/ui/chart1';
import Widget1 from '@/components/ui/widget1';
import Widget2 from '@/components/ui/widget2';

export default function Home() {
  return (
    <div className="flex-[6] mt-10">
      <div className="justify-center items-center">
       <div className="flex p-3 gap-8">
       <Widget1 />
       <Widget2 />
       <Chart1 />
       </div>
       <div className="flex p-3 gap-8">
     
    </div>
    </div>
    </div>
  );
}
