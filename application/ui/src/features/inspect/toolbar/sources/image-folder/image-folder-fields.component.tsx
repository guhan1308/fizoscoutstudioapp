    // Copyright (C) 2025-2026 Intel Corporation
    // SPDX-License-Identifier: Apache-2.0

    import { useState } from 'react';

    import { getApiUrl } from '@anomalib-studio/api';
    import { useProjectIdentifier } from '@anomalib-studio/hooks';
    import { Folder } from '@anomalib-studio/icons';
    import {
        ActionButton,
        FileTrigger,
        Flex,
        ProgressCircle,
        Text,
        TextField,
        toast,
        Tooltip,
        TooltipTrigger,
    } from '@geti/ui';

    import { ImagesFolderSourceConfig } from '../util';

    import classes from './image-folder-fields.module.scss';

    type ImageFolderFieldsProps = {
        defaultState: ImagesFolderSourceConfig;
    };

    const ACCEPTED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif', '.webp'];

    export const ImageFolderFields = ({ defaultState }: ImageFolderFieldsProps) => {
        const { projectId } = useProjectIdentifier();
        const [folderPath, setFolderPath] = useState(defaultState.images_folder_path || '');
        const [uploadedCount, setUploadedCount] = useState(0);
        const [isUploading, setIsUploading] = useState(false);

        const handleImagesUpload = async (files: FileList | null) => {
            if (!files || files.length === 0) return;

            setIsUploading(true);

            try {
                const formData = new FormData();
                Array.from(files).forEach((file) => formData.append('files', file));

                const url = getApiUrl(`/api/projects/${projectId}/sources:upload-images`);
                const response = await fetch(url, { method: 'POST', body: formData });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || `Upload failed with status ${response.status}`);
                }

                const data: { folder_path: string; image_count: number } = await response.json();
                setFolderPath(data.folder_path);
                setUploadedCount(data.image_count);

                toast({
                    title: 'Images uploaded',
                    type: 'success',
                    message: `${data.image_count} image${data.image_count !== 1 ? 's' : ''} uploaded successfully`,
                });
            } catch (error) {
                toast({
                    title: 'Upload failed',
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Failed to upload images. Please try again.',
                });
            } finally {
                setIsUploading(false);
            }
        };

        return (
            <Flex direction='column' gap='size-200'>
                <TextField isHidden label='id' name='id' defaultValue={defaultState?.id} />
                <TextField isHidden label='project_id' name='project_id' defaultValue={defaultState.project_id} />
                <TextField isHidden label='images_folder_path' name='images_folder_path' value={folderPath} />
                {/* ignore_existing_images=false so all uploaded images are processed */}
                <TextField isHidden label='ignore_existing_images' name='ignore_existing_images' value='false' />

                <TextField isRequired width='100%' label='Name' name='name' defaultValue={defaultState.name} />

                <Flex direction='row' gap='size-200' alignItems='end'>
                    <Flex direction='column' flex='1' gap='size-50'>
                        <Text UNSAFE_className={classes.uploadLabel}>Images</Text>
                        {uploadedCount > 0 ? (
                            <Text UNSAFE_className={classes.uploadedInfo}>
                                {uploadedCount} image{uploadedCount !== 1 ? 's' : ''} ready
                            </Text>
                        ) : (
                            <Text UNSAFE_className={classes.uploadHint}>No images uploaded yet</Text>
                        )}
                    </Flex>

                    <TooltipTrigger delay={300}>
                        <FileTrigger
                            acceptedFileTypes={ACCEPTED_IMAGE_TYPES}
                            allowsMultiple
                            onSelect={handleImagesUpload}
                        >
                            <ActionButton
                                UNSAFE_className={classes.folderIcon}
                                isDisabled={isUploading}
                                aria-label='Upload images'
                            >
                                {isUploading ? (
                                    <ProgressCircle size='S' isIndeterminate aria-label='Uploading' />
                                ) : (
                                    <Folder />
                                )}
                            </ActionButton>
                        </FileTrigger>
                        <Tooltip>Upload images (jpg, png, bmp, tiff, webp)</Tooltip>
                    </TooltipTrigger>
                </Flex>
            </Flex>
        );
    };
