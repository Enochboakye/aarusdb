

const MyDate = () => {
    const curDate = (sp:string) => {
      const today = new Date();
        let dd = today.getDate();
        let mm = today.getMonth()+1;
        const yyyy = today.getFullYear();

        if(dd < 10) dd = '0' + dd;
        if(mm < 10) mm = '0' + mm;
        return(`${mm}${sp}${dd}${sp}${yyyy}`)

    }
  return (
    curDate("/")
  )
}

export default MyDate