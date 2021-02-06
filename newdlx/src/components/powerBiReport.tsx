/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React, { useEffect } from 'react';
import { makeStyles, Theme } from '@material-ui/core/styles';
import { ReportEmbedding } from '../PowerBi/ReportEmbedding';

export interface IReportProps {
    reportName: string;
    theme: Theme;
}

export default function PowerBIReport(props: IReportProps) {
    const reportContainer = React.createRef<HTMLDivElement>();
    const reportEmbedding = new ReportEmbedding();

    const useStyles = makeStyles(() => ({
        container: {
            height: '100%',
        },
    }));

    const classes = useStyles(props.theme);

    useEffect(() => {
        const reportContainerHtml = reportContainer.current!; //make non nullable
        reportEmbedding.embedReport(props.reportName, reportContainerHtml);
    }, []);

    return <div ref={reportContainer} className={classes.container} />;
}
