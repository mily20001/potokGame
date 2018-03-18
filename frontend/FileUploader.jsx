import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './FileUploader.scss';

export default class FileUploader extends Component {
    constructor(props) {
        super();

        this.state = {
            filename: '',
            thumbnailReady: false,
            blob: null,
            imageHeight: 0,
            file: null,
            uploadStatus: -1,
        };

        this.imageTypes = ['map', 'dragon'];

        this.fixedImageType = this.imageTypes.includes(props.imageType);

        this.state.imageType = this.fixedImageType ? props.imageType : this.imageTypes[0];

        this.handleField = this.handleField.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleThumbnailLoad = this.handleThumbnailLoad.bind(this);
    }

    componentWillReceiveProps(nextProps) {
        this.fixedImageType = this.imageTypes.includes(nextProps.imageType);

        this.state.imageType = this.fixedImageType ? nextProps.imageType : this.imageTypes[0];
    }

    handleThumbnailLoad(e) {
        this.setState({ thumbnailReady: true, imageHeight: e.target.height });
    }

    handleField(fieldName, event) {
        if (fieldName === 'imageFile') {
            const files = event.target.files;
            this.setState({ thumbnailReady: false });
            const reader = new FileReader();
            reader.onload = (e) => {
                this.setState({ blob: e.target.result, file: files[0] });
            };

            if (files.length > 0) {
                reader.readAsDataURL(files[0]);
            }
        } else {
            this.setState({ [fieldName]: event.target.value });
        }
    }

    handleSubmit(e) {
        e.preventDefault();

        if (this.state.thumbnailReady === false) {
            return;
        }

        const data = new FormData();

        data.append('image', this.state.file);
        if (this.state.filename === '') {
            data.append('filename', this.state.file.name);
        } else {
            data.append('filename', this.state.filename);
        }
        data.append('imageType', this.state.imageType);

        // FIXME będzie się psuło jeśli będzie wysyłane coś innego niż obrazek

        data.append('dataType', this.state.blob.split(';')[0]);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);
        xhr.onload = () => {
            console.log('uploaded');
            console.log(xhr.responseText);
            const uploadResponse = JSON.parse(xhr.responseText);
            if (uploadResponse.ok !== undefined) {
                this.setState({ uploadStatus: 1 });
                this.props.refreshImageList();
            } else {
                this.setState({ uploadStatus: 2 });
            }
        };
        xhr.send(data);
        this.setState({ uploadStatus: 0 });
    }

    render() {
        const imageTypeOptions = this.imageTypes.map(imageType => (
            <option
                value={imageType}
            >
                {imageType}
            </option>
        ));

        return (
            <div className="container bg-dark text-light file-upload-container">
                <h2 className="text-center">{this.props.messageText}</h2><br />
                {this.state.uploadStatus === 0 &&
                    <div className="alert alert-info">Wysyłanie pliku...</div>
                }
                {this.state.uploadStatus === 1 &&
                <div className="alert alert-success">Wysyłanie pliku powiodło się</div>
                }
                {this.state.uploadStatus === 2 &&
                <div className="alert alert-danger">Wysyłanie pliku nie powiodło się</div>
                }
                <form className="form-horizontal" onSubmit={this.handleSubmit}>
                    <div className="form-group row">
                        <label className="control-label col-sm-2" htmlFor="imageFile">
                            Wybierz plik:
                        </label>
                        <div className="col-sm-10">
                            <input
                                type="file"
                                className="form-control bg-dark text-white"
                                accept="image/*"
                                id="imageFile"
                                name="imageFile"
                                onChange={e => this.handleField('imageFile', e)}
                            />
                        </div>
                    </div>
                    { this.props.customFileName &&
                        <div className="form-group row">
                            <label className="control-label col-sm-2" htmlFor="filename">
                                Nazwa pliku (opcjonalnie):
                            </label>
                            <div className="col-sm-10">
                                <input
                                    type="text"
                                    className="form-control bg-dark text-white"
                                    id="filename"
                                    name="filename"
                                    placeholder="Wprowadź opcjonalną nazwę pliku"
                                    value={this.state.filename}
                                    onChange={e => this.handleField('filename', e)}
                                />
                            </div>
                        </div>
                    }

                    { !this.fixedImageType &&
                    <div className="form-group row">
                        <label className="control-label col-sm-2" htmlFor="imageType">
                            Typ pliku
                        </label>
                        <div className="col-sm-10">
                            <select
                                className="form-control bg-dark text-white"
                                id="imageTypeFormField"
                                onChange={e => this.handleField('imageType', e)}
                                value={this.state.imageType}
                            >
                                {imageTypeOptions}
                            </select>
                        </div>
                    </div>
                    }

                    <div
                        style={{
                            height: this.state.thumbnailReady ? `${this.state.imageHeight}px` : 0,
                            visibility: this.state.thumbnailReady ? 'visible' : 'hidden',
                        }}
                        className="form-group row file-preview-row"
                    >
                        <div className="control-label col-sm-2">Podgląd:</div>
                        <div className="file-upload-container col-sm-10">
                            <div id="image-preview">
                                <img
                                    src={this.state.blob}
                                    onLoad={this.handleThumbnailLoad}
                                    alt="preview"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="col-sm-offset-2 col-sm-10">
                            <button
                                type="submit"
                                className="btn btn-outline-light btn-lg"
                            >
                                    Wyślij
                            </button>
                        </div>
                    </div>
                </form>
            </div>

        );
    }
}

FileUploader.propTypes = {
    imageType: PropTypes.string,
    messageText: PropTypes.string,
    customFileName: PropTypes.bool,
    refreshImageList: PropTypes.func,
};

FileUploader.defaultProps = {
    messageText: 'Wyślij plik',
    customFileName: false,
    imageType: '',
    refreshImageList: () => {},
};
