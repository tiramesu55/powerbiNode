import React, {useEffect, useState, FunctionComponent } from 'react';
import axios from 'axios';
import { useTheme } from '@material-ui/core/styles';
import SalesReports from "./components/showReport";
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import "./App.css"
interface Report {
  accessToken: string,
  embedUrl: any[],
  expiry: string,
  status: number
}
function App (): JSX.Element {
  const [state, setState] = useState<Report>({
    accessToken: "",
    embedUrl: [],
    expiry: "",
    status: 0
  });
  const theme = useTheme()
  useEffect(() => {
    
    axios.get<Report>('http://localhost:5300/getEmbedToken')
        .then( resp => setState(resp.data))
        .catch(err => console.log(err));
  }, []);
 return (
  <div style={{height: "100%"}}>{state.status === 200 && <PowerBIEmbed
    cssClassName = { "report-style-class" }
    embedConfig = {{
        type: 'report',   // Supported types: report, dashboard, tile, visual and qna
        id: state.embedUrl[0].reportId, 
        embedUrl: state.embedUrl[0].embedUrl,
        accessToken: state.accessToken,    // Keep as empty string, null or undefined
        tokenType: models.TokenType.Embed
      }}
  />}</div>
 )
}

export default App;
