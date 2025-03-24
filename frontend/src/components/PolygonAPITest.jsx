'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabaseClient';
import { rest } from '@/config/polygonClient';

const Polygon = () => {
    const [info, setInfo] = useState(null);
    
      useEffect(() =>{
        const fetchInfo = async () => {
            rest.stocks.aggregates("AAPL", 1, "day", "2023-01-01", "2023-04-14").then((data) => {
                console.log(data);
                setInfo(data);
            }).catch(e => {
                console.error('An error happened:', e);
            });

            /* FOR MORE EXAMPLES ON HOW TO USE, REFER
            TO THE DOCS: https://polygon.io/docs/rest/stocks/overview */
        };

        fetchInfo();
      }, []);


    return(
    <div>
      <h1>Polygon API TEST</h1>
      {info ? (
        <ul>
          {Object.entries(info).map(([key, value]) => (
            <li key={key}>
              <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
            </li>
          ))}
        </ul>
      ) : (
        <p>GETTING STOCK DATA</p>
      )}
    </div>
    )
};

export default Polygon;