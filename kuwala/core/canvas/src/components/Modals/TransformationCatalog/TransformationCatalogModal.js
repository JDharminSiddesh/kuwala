import React, {useEffect, useState} from "react";
import {useStoreActions} from "easy-peasy";
import {
    getAllTransformationCatalogCategories,
    getAllItemsInCategory
} from "../../../api/TransformationCatalog";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faShuffle} from "@fortawesome/free-solid-svg-icons";
import {getDataDictionary} from "../../../utils/SchemaUtils";
import ReactTable from "react-table-6";
import "./transformation-example-table.css";
import Modal from "../../Common/Modal";
import Button from "../../Common/Button";
import Classes from "./TransformationCatalogStyle";
import cn from "classnames";

const ExampleTable = ({columns, rows}) => {
    let populatedColumns = columns.map((el,i)=>{
        return {
            Header: el,
            accessor: el,
        }
    });

    populatedColumns = [{
        Header: "",
        id: "row",
        filterable: false,
        width: 50,
        Cell: (row) => {
            return <div>{row.index+1}</div>;
        }
    }, ...populatedColumns]

    const populatedRows = getDataDictionary(rows, columns);

    return (
        <div className={'transformation-example h-full'}>
            <ReactTable
                data={populatedRows}
                columns={populatedColumns}
                defaultPageSize={populatedRows.length >= 10 ? 10 : populatedRows.length}
                showPagination={false}
                showPaginationTop={false}
                showPaginationBottom={false}
                showPageSizeOptions={false}
                style={{
                    height: "100%",
                }}
            />
        </div>
    )
}

export default ({isOpen}) => {
    const { toggleTransformationCatalogModal } = useStoreActions(actions => actions.common);
    const [selectedTransformationIndex, setSelectedTransformationIndex] = useState(null);
    const [catalogCategories, setCatalogCategories] = useState([]);
    const [catalogOptions, setCatalogOptions] = useState([]);
    const [selectedCatalogOption, setSelectedCatalogOption] = useState(null);

    useEffect(() => {
        initTransformationCatalogs().then(null);
    }, [])

    useEffect(()=> {
        if(catalogCategories.length) {
            const tfId = catalogCategories[selectedTransformationIndex].id
            fetchCatalogBodyItems(tfId).then(null);
        }
    }, [selectedTransformationIndex])

    const initTransformationCatalogs = async () => {
        try{
            const res = await getAllTransformationCatalogCategories();
            if(res.status === 200){
                setCatalogCategories(res.data);
            } else {
                setCatalogCategories([]);
            }
        }catch(e) {
            console.error('Failed to get transformation catalog', e);
        }
    }

    const fetchCatalogBodyItems = async (transformationId) => {
        try{
            const res = await getAllItemsInCategory(transformationId);
            if(res.status === 200){
                setCatalogOptions(res.data);
            } else {
                setCatalogOptions([]);
            }
        }catch(e) {
            console.error('Failed to get transformation catalog', e);
        }
    }

    const CatalogSelector = () => {
        return (
            <div className={Classes.CatalogContainer}>
                <div className={Classes.CatalogContent}>
                    <FontAwesomeIcon
                        icon={faShuffle}
                        className={'h-6 w-6'}
                    />
                    <span className={'font-semibold'}>Transformation Blocks</span>
                </div>

                <div className={Classes.CatalogListContainer}>
                    {renderCatalogList()}
                </div>
            </div>
        )
    }

    const renderCatalogList = () => {
        if(catalogCategories.length) {
            return catalogCategories.map(renderCatalogItem)
        }
    }

    const renderCatalogItem = (catalogItem,index) => {
        return (
            <Button
                onClick={()=>{
                            setSelectedCatalogOption(null);
                            setSelectedTransformationIndex(index)
                        }}
                selected={selectedTransformationIndex === index}
                solid={false}
                color={'kuwalaRed'}
                icon={catalogItem.icon}
                text={catalogItem.name}
            />
        )
    }

    const CatalogBody = () => {
        return (
            <div className={Classes.CatalogBodyContainer}>
                {
                    selectedTransformationIndex !== null
                    ?
                        <SelectedTransformationCatalog/>
                    :
                        <div className={Classes.CatalogBodyAlertText}>
                            <p>To pick a transformation block,</p>
                            <p>select a transformation <span className={'text-kuwala-red'}>category</span> first</p>
                        </div>
                }
            </div>
        )
    }

    const SelectedTransformationCatalog = () => {
        if (selectedTransformationIndex === null || catalogOptions.length === 0) {
            return (
                <div>
                    No <span className={'text-kuwala-red'}>transformation</span> options found.
                </div>
            )
        } else {
            return (
                <div className={Classes.SelectedTransformationContainer}>
                    <div className={Classes.TransformationOptionsContainer}>
                        {renderTransformationOptions(catalogOptions)}
                    </div>
                    <div className={Classes.SelectedOptionDetailsContainer}>
                        <div className={Classes.OptionDetailsContainer}>
                            {renderSelectedOptionDetails()}
                        </div>
                    </div>
                </div>
            )
        }
    }

    const renderTransformationOptions = (options) => {
        return options.map(renderOptionItem)
    }

    const renderOptionItem = (optionItem, index) => {
        return (
            <Button
                solid={false}
                color={'kuwalaPurple'}
                onClick={()=>{
                    setSelectedCatalogOption(index)
                }}
                selected={selectedCatalogOption === index}
                icon={optionItem.icon}
                text={optionItem.name}
            />
        )
    }

    const renderSelectedOptionDetails = () => {
        if(selectedCatalogOption === null){
            return (
                <div className={Classes.OptionDetailsAlertText}>
                    <p>To see the <span className={'text-kuwala-purple'}>details</span> of a transformation block,</p>
                    <p>select one from the left</p>
                </div>
            )
        } else {
            const optionItem = catalogOptions[selectedCatalogOption];
            return (
                <div className={Classes.OptionDetailsContent}>
                    <div className={'text-kuwala-purple space-x-4'}>
                        <FontAwesomeIcon icon={optionItem.icon}/>
                        <span className={'font-semibold'}>
                            {optionItem.name}
                        </span>
                    </div>
                    <p className={'mt-2'}>
                        {optionItem.description}
                    </p>

                    {renderColumnType(
                        optionItem.required_column_types,
                        optionItem.optional_column_types)
                    }

                    <div className={Classes.OptionDetailsParameterAndExample}>
                        <div className={Classes.OptionDetailsParameterContainer}>
                            <p>Parameters</p>
                            {optionItem.macro_parameters.map((el) => <li>{el.name}</li>)}
                        </div>
                        <div className={Classes.OptionDetailsExampleContainer}>
                            {renderExampleTableWrapper(optionItem)}
                        </div>
                    </div>
                </div>
            )
        }
    }

    const renderColumnType = (requiredColumnTypesData, optionalColumnTypesData) => {
        let requiredColumnTypes, optionalColumnTypes;

        if(requiredColumnTypesData.length) {
            requiredColumnTypes = (
                <div className={cn(Classes.RequiredColumnBase, 'mt-6')}>
                        <span>
                            Required column types:
                        </span>
                    {renderBadgeList(requiredColumnTypesData)}
                </div>
            )
        }

        if(optionalColumnTypesData.length) {
            optionalColumnTypes = (
                <div className={cn(Classes.RequiredColumnBase, 'mt-2')}>
                        <span>
                            Optional column types:
                        </span>
                    {renderBadgeList(optionalColumnTypesData)}
                </div>
            )
        }

        return (
            <div>
                {requiredColumnTypes}
                {optionalColumnTypes}
            </div>
        )

    }

    const renderExampleTableWrapper = (optionItem) => {
        return (
            <div className={'flex flex-col'}>
                {renderExampleTable({
                    examplesData: optionItem.examples_before,
                    text: 'Before'
                })}
                {renderExampleTable({
                    examplesData: optionItem.examples_after,
                    text: 'After'
                })}
            </div>
        )
    }

    const renderExampleTable = ({examplesData, text}) => {
        return (
            <div className={'mb-2'}>
                <span className={cn(Classes.ExampleBase,'my-2')}>
                   {text}
                </span>
                {examplesData.map((el) => {
                    return (
                        <div className={'flex flex-col mb-2'}>
                            <ExampleTable
                                columns={el.columns}
                                rows={el.rows}
                            />
                        </div>
                    )
                })}
            </div>
        )
    }

    const renderBadgeList = (badgeStringList) => {
        if(!badgeStringList || !badgeStringList.length) return
        return badgeStringList.map((el) => {
            return (
                <div className={Classes.BadgeBase}>
                    {el}
                </div>
            )
        })
    }

    const CatalogFooter = () => {
        return (
            <div className={Classes.ModalFooterContainer}>
                <Button
                    onClick={toggleTransformationCatalogModal}
                    text={'Back'}
                />
                <Button
                    text={'Add to canvas'}
                />
            </div>
        )
    }

    return (
        <Modal
            isOpen={isOpen}
            closeModalAction={toggleTransformationCatalogModal}
        >
            <CatalogSelector/>
            <CatalogBody/>
            <CatalogFooter/>
        </Modal>
    )
}