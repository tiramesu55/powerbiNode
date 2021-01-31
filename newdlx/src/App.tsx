import React, {useEffect, useState, FunctionComponent } from 'react';
import axios from 'axios';

interface iTest {
  express: string
}
const App:FunctionComponent = () => {
  const [state, setState] = useState<string>('');
  useEffect(() => {
    
    axios.get<iTest>('http://localhost:5300/test')
        .then( resp => setState(resp.data.express))
        .catch(err => console.log(err));
  }
         
, []);
 return (
   <div>{state}</div>
 )
}

export default App;
