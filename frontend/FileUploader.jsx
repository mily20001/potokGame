import React, { Component } from 'react';
import PropTypes from 'prop-types';

import './FileUploader.scss';

export default class FileUploader extends Component {
    constructor(props) {
        super(props);

        this.state = {
            filename: '',
            thumbnailReady: false,
            blob: null,
            imageHeight: 0,
            file: null,
            uploadStatus: -1,
        };

        this.handleField = this.handleField.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleThumbnailLoad = this.handleThumbnailLoad.bind(this);
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
        data.append('imageType', this.props.imageType);


        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);
        xhr.onload = () => {
            console.log('uploaded');
            console.log(xhr.responseText);
            const uploadResponse = JSON.parse(xhr.responseText);
            if (uploadResponse.ok !== undefined) {
                this.setState({ uploadStatus: 1 });
            } else {
                this.setState({ uploadStatus: 2 });
            }
        };
        xhr.send(data);
        this.setState({ uploadStatus: 0 });
    }

    render() {
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
    imageType: PropTypes.string.isRequired,
    messageText: PropTypes.string,
    customFileName: PropTypes.bool,
};

FileUploader.defaultProps = {
    messageText: 'Wyślij plik',
    customFileName: false,
};
