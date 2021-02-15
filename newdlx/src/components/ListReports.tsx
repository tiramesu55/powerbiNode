/* eslint-disable react/jsx-key */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

const useStyles = makeStyles((theme) => ({
    root: {
        width: '100%',
        maxWidth: 360,
        maxHeight: 500,
        backgroundColor: theme.palette.background.paper,
        overflow: 'auto',
    },
}));

// interface ListReportProps {
//     reports: ReportProps[];
// }
// interface ReportProps {
//     reportId: string;
//     reportName: string;
// }

// function ListItemLink(props: any) {
//     return <ListItem button component="a" {...props} />;
// }

export default function SimpleList(props: any) {
    const classes = useStyles();

    return (
        <div className={classes.root}>
            <List component="nav" aria-label="secondary mailbox folders">
                {props.reports.map((el: any) => (
                    <ListItem key={el.reportId} button>
                        <ListItemText primary={el.reportName} onClick={() => props.setReport(el.reportId)} />
                    </ListItem>
                ))}
            </List>
        </div>
    );
}
