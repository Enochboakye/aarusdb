
import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import {PageContainer} from '@/components/page-container'
import ButtonBar from '@/components/ui/buttonbar'
import GetUsers from '@/components/usersview'

export default async function AdminDashboard() {
  if (!checkRole('admin')) {
    redirect('/')
  }

    
  return (
    <PageContainer className='justify-items-center items-center mt-4'>
      <div className=" space-y-6 max-w-5xl mx-auto">
       
        <div>
         <ButtonBar/>  
        </div>
        <div>
          <GetUsers/>
        </div>
        
        
        


      </div>



      
    </PageContainer>
  )
}