import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';

import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { Chip, Button } from '@mui/material';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';

import MenuIcon from '@mui/icons-material/Menu';
import MyLocationIcon from '@mui/icons-material/MyLocation';

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@mui/material';

const EditorComponent = () => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const [tags, setTags] = useState([]);

    const [selectedSocialM, setSelectedMovie] = React.useState(null);

    const [openConfirm, setOpenConfirm] = useState(false);

    const top100Films = [
        { label: 'YouTube', value: 1972 },
        { label: 'Instegrame', value: 1974 },
        { label: 'FaceBook', value: 2008 },
        { label: 'Twitter', value: 1957 },]

    const handleSelect = (event, newValue) => {
        if (newValue) {
            console.log('Selected movie:', newValue);
            setSelectedMovie(newValue);

        }
    };

    const handleSubmit = () => {

    };

    const handleDelete = () => {
        setOpenConfirm(true);
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && event.target.value) {
            event.preventDefault();
            const value = event.target.value.trim();
            if (value && !tags.includes(value) && tags.length < 5) {
                setTags([...tags, value]);
            }
        }
    };

    const handleConfirmDelete = () => {
        setOpenConfirm(false);
        // Proceed with deletion logic
        console.log("Item deleted!");

    };

    const handleCancelDelete = () => {
        setOpenConfirm(false);

    };


    useEffect(() => {
        if (!mapContainerRef.current) return;

        const map = new maplibregl.Map({
            container: mapContainerRef.current,
            style: "https://demotiles.maplibre.org/style.json", // Free open-source style
            center: [25.4858, 42.7339], // Centered on Bulgaria
            zoom: 6,
        });

        mapRef.current = map;

        // Add zoom and rotation controls
        map.addControl(new maplibregl.NavigationControl(), "top-left");

        return () => map.remove();
    }, []);


    return (
        <div className="editor-container">
            <div className="header-container">
                <Box position={"relative"} zIndex={999} sx={{ flexGrow: 1, }} >
                    <AppBar position="static"  >
                        <Toolbar className='header-content' sx={{ bgcolor: 'white', }}>
                            <IconButton
                                size="large"
                                edge="start"
                                color="inherit"
                                aria-label="open drawer"
                                sx={{ mr: 2, display: { xs: 'block', sm: 'none' } }}
                            >
                                <MenuIcon color="primary.main" />
                            </IconButton>
                            <Typography
                                variant="h5"
                                noWrap
                                component="div"
                                color="primary.main"
                                sx={{ flexGrow: 1, fontWeight: '600', display: { xs: 'none', sm: 'block' } }}
                            >
                                Намери творци
                            </Typography>
                        </Toolbar>
                    </AppBar>
                </Box>
            </div>

            <Box className='edit-page-form' sx={{ borderRadius: "10px", bgcolor: "white", boxShadow: 3 }}  >
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: '600', marginBottom: 1 }}>
                    Editor Panel
                </Typography>
                <List>
                    <TextField className='input-field-1' fullWidth size='small' id="outlined-basic" label="Name" placeholder='Name on the map' variant="outlined" />

                    <TextField

                        className='input-field-1'
                        fullWidth
                        sx={{ marginTop: '10px', }}
                        id="outlined-multiline-static"
                        label="Description"
                        multiline
                        rows={4}

                    />
                </List>
                <Divider />
                <List >
                    <Autocomplete
                        className='input-field-1'
                        disablePortal
                        options={top100Films}
                        sx={{ borderRadius: '10px' }}
                        size="small"
                        renderInput={(params) => <TextField {...params} label="Social Media Type" />}
                        placeholder="Select a Social Media Type"
                        getOptionLabel={(option) => option.label}
                        onChange={handleSelect}
                    />

                    {selectedSocialM && (
                        <Autocomplete
                            className='input-field-1'
                            disablePortal
                            options={top100Films}
                            // onChange={handleSecondSelect}
                            size="small"
                            sx={{ marginTop: '10px' }}
                            renderInput={(params) => <TextField {...params} label="Sub Option" />}
                        />
                    )}

                </List>
                <Divider />
                <List>
                    <Autocomplete
                        className='input-field-1'
                        multiple
                        freeSolo
                        filterSelectedOptions
                        options={[]} // no dropdown options
                        value={tags}
                        onChange={(event, newValue) => {
                            // prevent more than 5 tags
                            if (newValue.length <= 5) {
                                setTags(newValue);
                            }
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    variant="outlined"
                                    label={option}
                                    {...getTagProps({ index })}
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Add up to 5 tags"
                                onKeyDown={handleKeyDown}
                            />
                        )}
                    />
                </List>
                <Divider />
                <Button fullWidth variant='outlined' sx={{ borderRadius: '10px', marginTop: '10px', marginBottom: "10px" }}>
                    <MyLocationIcon sx={{ mr: 1 }} />
                    Mark the Location
                </Button>
                <Divider />

                <Button fullWidth onClick={handleSubmit} variant="contained" color="primary" sx={{ alignItems: 'center', marginTop: '10px', borderRadius: '10px' }} >Save</Button>
                <Button fullWidth onClick={handleDelete} variant="contained" color="error" sx={{ alignItems: 'center', marginTop: '10px', borderRadius: '10px' }} >Delete Member</Button>
            </Box >

            <Dialog
                open={openConfirm}
                onClose={handleCancelDelete}
            >
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText textAlign={'center'}>
                        Are you sure you want to delete this member from the map? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button variant='outlined' onClick={handleCancelDelete} color="primary">
                        Cancel
                    </Button>
                    <Button variant='contained' onClick={handleConfirmDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <div
                ref={mapContainerRef}
                className="map-container"
            />
        </div>
    )
}

export default EditorComponent