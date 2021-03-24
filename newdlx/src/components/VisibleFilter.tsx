/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';

export interface VisualInterface {
    title: string;
    visible: boolean;
}

interface IReportProps {
    visuals: VisualInterface[];
    handleChecked: any;
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
            maxWidth: 360,
            backgroundColor: theme.palette.background.paper,
        },
    }),
);

const CheckboxList = (props: IReportProps) => {
    const classes = useStyles();
    return (
        <List className={classes.root}>
            {props.visuals.map((value) => {
                const labelId = `checkbox-list-label-${value.title}`;

                return (
                    <ListItem
                        key={value.title}
                        role={undefined}
                        dense
                        button
                        onClick={() => props.handleChecked(value.title)}
                    >
                        <ListItemIcon>
                            <Checkbox
                                edge="start"
                                checked={value.visible}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': labelId }}
                            />
                        </ListItemIcon>
                        <ListItemText id={labelId} primary={value.title} />
                    </ListItem>
                );
            })}
        </List>
    );
};

export default CheckboxList;
