/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React from 'react';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            '& > *': {
                margin: theme.spacing(1),
            },
        },
        input: {
            display: 'none',
        },
    }),
);

const UploadButtons = () => {
    const classes = useStyles();
    const [files, setFiles] = React.useState([]);
    const onClickHandler = () => {
        const data = new FormData();
        console.log(files);
        if (files) {
            for (let x = 0; x < files.length; x++) {
                data.append('file', files[x]);
            }
            fetch('http://localhost:5300/upload', {
                method: 'POST',
                headers: {
                    //      'Content-Type': 'multipart/form-data',
                },
                body: data,
            })
                .then(
                    (response) => response.json(), // if the response is a JSON object
                )
                .then(
                    (success) => console.log(success), // Handle the success response object
                )
                .catch(
                    (error) => console.log(error), // Handle the error response object
                );
        }
    };
    const onChangeHandler = (event: { target: { files: any } }) => {
        const files = event.target.files;
        setFiles(files);
    };
    return (
        <div className={classes.root}>
            <input
                className={classes.input}
                id="contained-button-file"
                multiple
                type="file"
                onChange={onChangeHandler}
            />
            <label htmlFor="contained-button-file">
                <Button variant="contained" color="primary" component="span" onClick={onClickHandler}>
                    Upload
                </Button>
            </label>
        </div>
    );
};
export default UploadButtons;
